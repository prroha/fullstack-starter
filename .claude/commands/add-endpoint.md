Add a new API endpoint: $ARGUMENTS

## Instructions

You are adding a new backend API endpoint. Follow these patterns from `core/backend/`:

### Route Pattern

```typescript
import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";
import { someService } from "../services/some.service";
import { successResponse, paginatedResponse } from "../utils/response";
import { z } from "zod";

const router = Router();

// Validation schemas at the top
const createSchema = z.object({ ... });

// Routes
router.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await someService.list(+page, +limit);
    res.json(paginatedResponse(result.items, +page, +limit, result.total));
  } catch (error) { next(error); }
});

router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const validated = createSchema.parse(req.body);
    const result = await someService.create(validated, req.user.id);
    res.status(201).json(successResponse(result, "Created"));
  } catch (error) { next(error); }
});

export default router;
```

### Service Pattern

```typescript
import { db } from "../lib/db";
import { ApiError } from "../middleware/error.middleware";

class SomeService {
  async list(page: number, limit: number) {
    const [items, total] = await Promise.all([
      db.model.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.model.count(),
    ]);
    return { items, total };
  }
}

export const someService = new SomeService();
```

## Rules

- ALWAYS use `successResponse` / `paginatedResponse` / `ApiError` from core
- ALWAYS use Zod for input validation
- NEVER write manual pagination math — `paginatedResponse` handles it
- NEVER write manual error responses — throw `ApiError`
- For modules: copy auth middleware pattern from `modules/lms/backend/src/middleware/auth.ts`
- Singleton services: `export const service = new Service()`
