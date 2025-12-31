# Souq Yemen App (نسخة كاملة أساس)

تطبيق سوق اليمن (إعلانات + عملات + مزاد + لوحة إدارة) مبني باستخدام:

- React Native + Expo
- Firebase Auth + Firestore

## الخطوات

1. ثبّت الأدوات:
   - Node.js آخر إصدار
   - `npm install --global expo-cli` (أو استخدم npx)

2. داخل مجلد المشروع:

```bash
npm install
npm start
```

3. عدّل ملف `src/firebase.js` وضع إعدادات مشروع Firebase الخاص بك.

4. في Firestore:
   - أنشئ مجموعة `listings`
   - أنشئ وثيقة `settings/rates` وفيها:
     - `usdToYer: 1632`
     - `sarToYer: 425`

5. تسجيل الدخول:
   - سجّل حساب مدير باستخدام البريد الذي تضعه في `ADMIN_EMAIL` في:
     - `src/navigation/RootNavigator.js`

بعدها تقدر تطوّر باقي المميزات (الصور، الخرائط، المحادثات الكاملة، إشعارات، إلخ).
