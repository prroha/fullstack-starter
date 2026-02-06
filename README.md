# Fullstack Starter

A production-ready monorepo starter template for building full-stack applications.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js + Express + Prisma + TypeScript |
| **Web** | Next.js 15 + React 19 + Tailwind CSS v4 |
| **Mobile** | Flutter + Riverpod + Clean Architecture |

## Features

### Backend
- JWT authentication with httpOnly cookies
- Role-based access control (USER, ADMIN)
- Standardized error handling & response format
- Request validation with Zod
- Rate limiting & security headers (Helmet)
- Structured logging
- Prisma ORM with PostgreSQL
- ESLint 9 flat config

### Web
- Next.js 15 App Router
- TypeScript strict mode
- Auth context with automatic token refresh
- Tailwind CSS v4 with OKLCH colors
- Dark mode support

### Mobile
- Clean Architecture (data/domain/presentation)
- Riverpod state management
- Dio HTTP client with interceptors
- Secure token storage
- Either pattern for error handling (dartz)
- Freezed for immutable models

---

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL
- Flutter 3.2+

### 1. Clone or Use Template
```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/fullstack-starter.git my-new-project
cd my-new-project

# Or use GitHub template button
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your database URL and secrets
npm install
npx prisma migrate dev --name init
npm run dev
```

### 3. Web Setup
```bash
cd web
cp .env.local.example .env.local
npm install
npm run dev
```

### 4. Mobile Setup
```bash
cd mobile
flutter pub get
flutter run
```

---

## Project Structure

```
fullstack-starter/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment config
│   │   ├── controllers/     # Route handlers
│   │   ├── lib/             # Core utilities (db, logger)
│   │   ├── middleware/      # Auth, error handling
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Helper functions
│   │   └── app.ts           # Express app entry
│   └── prisma/
│       └── schema.prisma    # Database schema
│
├── web/
│   └── src/
│       ├── app/             # Next.js pages
│       ├── components/      # React components
│       └── lib/             # API client, auth context
│
└── mobile/
    └── lib/
        ├── core/            # Constants, errors, network, theme
        ├── data/            # Models, datasources, repositories
        ├── domain/          # Entities, repository interfaces
        └── presentation/    # Screens, widgets, providers
```

---

## Adding New Features

### Backend: Add a new API endpoint

1. Create service (`src/services/post.service.ts`):
```typescript
import { db } from "../lib/db";

class PostService {
  async getAll() {
    return db.post.findMany();
  }

  async create(data: { title: string; content: string; authorId: string }) {
    return db.post.create({ data });
  }
}

export const postService = new PostService();
```

2. Create controller (`src/controllers/post.controller.ts`):
```typescript
import { Request, Response, NextFunction } from "express";
import { postService } from "../services/post.service";
import { successResponse } from "../utils/response";

class PostController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const posts = await postService.getAll();
      res.json(successResponse({ posts }));
    } catch (error) {
      next(error);
    }
  }
}

export const postController = new PostController();
```

3. Create routes (`src/routes/post.routes.ts`):
```typescript
import { Router } from "express";
import { postController } from "../controllers/post.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", (req, res, next) => postController.list(req, res, next));
router.post("/", authMiddleware, (req, res, next) => postController.create(req, res, next));

export default router;
```

4. Register in `src/routes/index.ts`:
```typescript
import postRoutes from "./post.routes";
v1Router.use("/posts", postRoutes);
```

### Mobile: Add a new feature

1. Create entity (`lib/domain/entities/post.dart`):
```dart
class Post {
  final String id;
  final String title;
  final String content;

  const Post({required this.id, required this.title, required this.content});
}
```

2. Create model (`lib/data/models/post_model.dart`):
```dart
import 'package:freezed_annotation/freezed_annotation.dart';
import '../../domain/entities/post.dart';

part 'post_model.freezed.dart';
part 'post_model.g.dart';

@freezed
class PostModel with _$PostModel {
  const PostModel._();

  const factory PostModel({
    required String id,
    required String title,
    @Default('') String content,
  }) = _PostModel;

  factory PostModel.fromJson(Map<String, dynamic> json) =>
      _$PostModelFromJson(json);

  Post toEntity() => Post(id: id, title: title, content: content);
}
```

3. Run code generation:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

---

## API Response Format

### Success
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

### Paginated
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=8000
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
```

### Web (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Mobile
```bash
flutter run --dart-define=API_URL=http://10.0.2.2:8000/api/v1
```

---

## Commands

### Backend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run db:migrate:dev  # Create migration
npm run db:studio    # Open Prisma Studio
```

### Web
```bash
npm run dev    # Start dev server
npm run build  # Build for production
npm run lint   # Run ESLint
```

### Mobile
```bash
flutter run           # Run app
flutter build apk     # Build Android APK
flutter analyze       # Run analyzer
flutter pub run build_runner build  # Generate code
```

---

## License

MIT
