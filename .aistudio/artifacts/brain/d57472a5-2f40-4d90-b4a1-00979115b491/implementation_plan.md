# Maliyyə Modulu: Ödəniş Məbləği Düzəlişi və Borclar Sistemi İcra Planı

İstifadəçinin tələb və seçimlərinə uyğun olaraq Maliyyə modulunda aşkarlanan məhdudiyyətlərin həlli və yeni borc monitorinqi sisteminin qurulması planı:

---

## 1. Ödəniş Məbləği Daxiletmə Məhdudiyyətinin Aradan Qaldırılması (Step Xətası)

### Problem:
- `FinanceView.tsx` daxilindəki ödəniş formunda endirim və ödənilən məbləğ xanalarında `min="1"` və `step="5"` qeyd edildiyi üçün brauzerin daxili HTML5 validasiyası məbləği `1, 6, 11, ... 51, 56, 61` kimi hesablayır və standart 60 AZN yazıldıqda "ən yaxın dəyərlər 56 və ya 61-dir" xətası verərək formu bloklayır.

### Həll:
- `payDiscount` və `payAmount` sahələrində `step="5"` parametri `step="any"` ilə əvəz edilir, `min="0.01"` təyin olunur.
- İstifadəçilər 60 AZN, 50 AZN, 120 AZN və ya qəpiklə istənilən məbləği sərbəst şəkildə yaza və təsdiqləyə biləcək.

---

## 2. Maliyyə Xülasə Göstəricilərinə "Yığılacaq Borclar" Kartının Əlavə Edilməsi

- **KPI Göstəricisi:** Maliyyə səhifəsinin yuxarısındakı xülasə kartlarına (Mədaxil, Əməkhaqqı, Xərclər, Mənfəət) əlavə olaraq **"Yığılacaq Borclar" (Gözlənilən Debitor Borc)** kartı əlavə edilir.
- **Filial Filtrləməsi:**
  - Seçilmiş filial üzrə (və ya Superadmin üçün bütün filiallar üzrə) tələbələrin faktiki mənfi balansları (`balance < 0`) və ödənilməmiş borc qeydləri cəmlənir.
  - Kart üzərində ümumi borc məbləği (məs: `5,219 AZN`) və borclu tələbə sayı göstərilir.

---

## 3. "Borclar" Alt Bölməsinin (Sub-Tab) Qurulması

- **Yeni Alt Bölmə:** `Ödənişlər`, `Maaşlar`, `Xərclər`, `Əlavə Gəlir`, `Matris` tablarının yanına **`Borclar` (say göstəricisi ilə)** alt tabı əlavə edilir.
- **Funksionallıqlar:**
  1. **Filial və Qrup Filtrləri:** Menecer yalnız öz filialının borclu tələbələrini, direktor isə istədiyi filialı və ya bütün şəbəkəni seçə bilir.
  2. **Ətraflı Cədvəl:** Tələbənin adı, FİN kodu, Qrupu, Kursu, Müqavilə üzrə aylıq təhsil haqqı, Qalan borc məbləği və son ödəniş tarixi.
  3. **1-Kliklə "Ödəniş Qəbul Et" Düyməsi:** Hər bir borclu tələbənin qarşısındakı düyməyə basdıqda ödəniş pəncərəsi həmin tələbə və müqavilə məbləği ilə avtomatik hazır açılır.
  4. **WhatsApp Xatırlatma:** Valideynin nömrəsinə standart borc bildirişi göndərmək üçün 1-kliklə WhatsApp keçidi.
  5. **Excel/CSV İxrac:** Filial üzrə borclular siyahısını yükləmək imkanı.

---

## 4. Test və Yoxlama

1. Ödəniş qəbulu pəncərəsində 60 AZN, 75 AZN, 100 AZN daxil edilərək qəbzin rəvan formalaşdırılmasının yoxlanılması.
2. Filial dəyişdikdə "Yığılacaq Borclar" kartının və cədvəlinin dərhal həmin filiala uyğun dəyişməsinin təsdiqlənməsi.
3. TypeScript lint və build testlərinin yoxlanılması.
