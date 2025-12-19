# Network App - Native Build Guide

## متطلبات البناء

### لنظام Android:
- [Android Studio](https://developer.android.com/studio) (أحدث إصدار)
- Java JDK 17 أو أحدث
- حساب [Google Play Console](https://play.google.com/console) ($25 مرة واحدة)

### لنظام iOS:
- جهاز Mac مع macOS
- [Xcode](https://apps.apple.com/app/xcode/id497799835) (أحدث إصدار)
- حساب [Apple Developer](https://developer.apple.com) ($99/سنة)

---

## خطوات البناء

### 1. استنساخ المشروع
```bash
git clone [YOUR_GITHUB_REPO_URL]
cd [PROJECT_NAME]
```

### 2. تثبيت التبعيات
```bash
npm install
```

### 3. بناء المشروع
```bash
npm run build
```

### 4. إضافة منصة Android
```bash
npx cap add android
npx cap sync android
```

### 5. فتح في Android Studio
```bash
npx cap open android
```

---

## إنشاء ملف APK/AAB للمتجر

### في Android Studio:

1. **Build → Generate Signed Bundle / APK**
2. اختر **Android App Bundle (AAB)** للمتجر
3. **Create new keystore** أو استخدم موجود:
   - Key store path: اختر مكان الحفظ
   - Password: كلمة مرور قوية
   - Key alias: اسم المفتاح
   - Validity: 25 سنة أو أكثر
4. اختر **release**
5. انتظر البناء

### موقع الملف:
```
android/app/release/app-release.aab
```

---

## رفع على Google Play Store

### 1. إنشاء تطبيق في Play Console
- اذهب إلى [Google Play Console](https://play.google.com/console)
- اضغط "Create app"
- املأ المعلومات الأساسية

### 2. إعداد صفحة المتجر
- **اسم التطبيق**: Network App
- **وصف قصير**: تطبيق تواصل اجتماعي حديث
- **وصف كامل**: [أضف وصف تفصيلي]
- **أيقونة التطبيق**: 512x512 بكسل
- **لقطات شاشة**: على الأقل 2 صور لكل جهاز

### 3. تقييم المحتوى
- أكمل استبيان تقييم المحتوى
- احصل على التصنيف العمري

### 4. رفع الملف
- Production → Create new release
- ارفع ملف `.aab`
- أضف ملاحظات الإصدار
- Review and roll out

---

## أيقونات التطبيق

ضع الأيقونات في المجلدات التالية بعد `npx cap add android`:

```
android/app/src/main/res/
├── mipmap-hdpi/ic_launcher.png (72x72)
├── mipmap-mdpi/ic_launcher.png (48x48)
├── mipmap-xhdpi/ic_launcher.png (96x96)
├── mipmap-xxhdpi/ic_launcher.png (144x144)
├── mipmap-xxxhdpi/ic_launcher.png (192x192)
```

---

## Splash Screen

ضع صورة البداية في:
```
android/app/src/main/res/drawable/splash.png
```

---

## ملاحظات مهمة

1. **احتفظ بملف Keystore** - إذا فقدته لن تستطيع تحديث التطبيق
2. **اختبر على أجهزة حقيقية** قبل الرفع
3. **راجع سياسات Google Play** لتجنب الرفض
4. **أضف سياسة الخصوصية** - إلزامية للتطبيقات

---

## الدعم

للمساعدة، راجع:
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
