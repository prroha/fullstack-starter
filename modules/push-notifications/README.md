# Push Notifications Module

Push notifications for web and mobile applications using Firebase Cloud Messaging (FCM).

## Features

- Firebase Cloud Messaging integration
- Web push notifications via Service Worker
- Mobile push notifications (Android/iOS)
- Device token management
- Topic-based messaging
- Scheduled notifications
- Rich notifications with images and actions

## Installation

### Backend Dependencies

```bash
cd backend
npm install firebase-admin
```

### Web Dependencies

```bash
cd web
npm install firebase
```

### Mobile Dependencies

Add to `pubspec.yaml`:

```yaml
dependencies:
  firebase_core: ^2.24.0
  firebase_messaging: ^14.7.0
  flutter_local_notifications: ^16.3.0
```

## Environment Variables

### Backend (`backend/.env`)

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

# Optional
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

### Web (`web/.env.local`)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```

## Setup Instructions

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Cloud Messaging in Project Settings

### 2. Backend Setup

1. Download service account key from Firebase Console:
   - Project Settings > Service Accounts > Generate New Private Key
2. Add credentials to `.env` file
3. Register routes in `backend/src/routes/index.ts`:

```typescript
import notificationsRoutes from "@modules/push-notifications/backend/src/routes/notifications.routes";

v1Router.use("/notifications", notificationsRoutes);
```

### 3. Web Setup

1. Create `public/firebase-messaging-sw.js`:

```javascript
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || "New notification", {
    body,
    icon: icon || "/icon.png",
  });
});
```

2. Initialize in your app:

```typescript
import { initPushNotifications, requestPermission } from "@/lib/push-notifications";

// Initialize on app load
await initPushNotifications();

// Request permission when appropriate
const token = await requestPermission();
if (token) {
  // Send token to backend
  await fetch("/api/notifications/register", {
    method: "POST",
    body: JSON.stringify({ token, platform: "web" }),
  });
}
```

### 4. Mobile Setup

#### Android

1. Add `google-services.json` to `android/app/`
2. Update `android/build.gradle`:

```gradle
dependencies {
    classpath 'com.google.gms:google-services:4.4.0'
}
```

3. Update `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'
```

#### iOS

1. Add `GoogleService-Info.plist` to `ios/Runner/`
2. Enable Push Notifications capability in Xcode
3. Configure APNs in Firebase Console

#### Flutter

```dart
import 'push_notification_service.dart';

// Initialize in main.dart
await PushNotificationService().init();

// Get token and send to backend
final token = await PushNotificationService().getToken();
```

## Database Schema

Add to `prisma/schema.prisma`:

```prisma
model DeviceToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  platform  String   // 'web', 'android', 'ios'
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String?
  title     String
  body      String
  data      Json?
  status    String   @default("pending") // pending, sent, failed
  sentAt    DateTime?
  createdAt DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([status])
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/notifications/register` | Register device token |
| DELETE | `/notifications/unregister` | Remove device token |
| POST | `/notifications/send` | Send notification (admin) |
| POST | `/notifications/send-topic` | Send to topic (admin) |
| GET | `/notifications/history` | Get notification history |

## Usage Examples

### Backend: Send Notification

```typescript
import { getPushService } from "./services/push.service";

const push = getPushService();

// Send to single device
await push.sendToDevice("device-token", {
  title: "Hello",
  body: "You have a new message",
  data: { type: "message", id: "123" },
});

// Send to multiple devices
await push.sendToDevices(["token1", "token2"], {
  title: "Announcement",
  body: "New feature available!",
});

// Send to topic
await push.sendToTopic("news", {
  title: "Breaking News",
  body: "Something happened",
});
```

### Web: Listen for Messages

```typescript
import { onMessage } from "@/lib/push-notifications";

onMessage((payload) => {
  console.log("Received message:", payload);
  // Show notification or update UI
});
```

### Mobile: Handle Notifications

```dart
PushNotificationService().onMessage.listen((notification) {
  // Handle foreground notification
});

PushNotificationService().onMessageOpenedApp.listen((notification) {
  // Handle notification tap
});
```

## Troubleshooting

### Web notifications not showing

1. Ensure Service Worker is registered
2. Check browser notification permissions
3. Verify VAPID key is correct
4. Check browser console for errors

### Mobile notifications not received

1. Verify `google-services.json` / `GoogleService-Info.plist`
2. Check FCM token is valid
3. Ensure app is not being killed by battery optimization
4. For iOS, verify APNs configuration

### Token registration failing

1. Check Firebase credentials in backend
2. Verify database connection
3. Check if user is authenticated

## Security Considerations

- Never expose Firebase Admin credentials on client
- Validate user ownership before sending to tokens
- Implement rate limiting on notification endpoints
- Store tokens securely with user association
- Clean up inactive/expired tokens regularly
