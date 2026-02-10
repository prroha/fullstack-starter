# Template Presets

> Pre-configured project templates for the code generator.

---

## Overview

Templates are complete project configurations that bundle multiple features together at a discounted price. Each template includes a curated set of features optimized for a specific use case.

## Available Templates

| Template                                | Description                    | Price | Tier     |
| --------------------------------------- | ------------------------------ | ----- | -------- |
| [LMS](/templates/lms)                   | Learning Management System     | $149  | PRO      |
| [SaaS Starter](/templates/saas-starter) | Basic SaaS application starter | $49   | STARTER  |
| [E-commerce](/templates/ecommerce)      | Full e-commerce platform       | $299  | BUSINESS |

---

## Template Structure

Each template directory contains:

```
template-name/
  config.json    # Template configuration
  README.md      # Template-specific documentation
```

### config.json Schema

```json
{
  "id": "unique-id",
  "slug": "template-slug",
  "name": "Template Name",
  "description": "Full template description",
  "shortDescription": "Short description for cards",
  "price": 14900,
  "tier": "PRO",
  "includedFeatures": ["feature.id"],
  "previewImageUrl": "/images/templates/slug.png",
  "iconName": "IconName",
  "color": "#4F46E5",
  "displayOrder": 1,
  "isActive": true,
  "isFeatured": true
}
```

### Field Descriptions

| Field              | Type    | Description                                              |
| ------------------ | ------- | -------------------------------------------------------- |
| `id`               | string  | Unique identifier (UUID format recommended)              |
| `slug`             | string  | URL-friendly identifier                                  |
| `name`             | string  | Display name                                             |
| `description`      | string  | Full description for detail pages                        |
| `shortDescription` | string  | Brief description for cards/lists                        |
| `price`            | number  | Price in cents (e.g., 14900 = $149.00)                   |
| `tier`             | string  | Required tier: BASIC, STARTER, PRO, BUSINESS, ENTERPRISE |
| `includedFeatures` | array   | List of feature slugs from FEATURE_REGISTRY.md           |
| `previewImageUrl`  | string  | Path to preview image                                    |
| `iconName`         | string  | Lucide icon name for UI                                  |
| `color`            | string  | Brand color (hex format)                                 |
| `displayOrder`     | number  | Sort order in listings                                   |
| `isActive`         | boolean | Whether template is available                            |
| `isFeatured`       | boolean | Show in featured section                                 |

---

## Feature References

All feature slugs must reference valid entries in `/docs/FEATURE_REGISTRY.md`.

Common feature categories:

- `core.*` - Core setup features
- `auth.*` - Authentication features
- `security.*` - Security features
- `payments.*` - Payment features
- `storage.*` - File storage features
- `comms.*` - Communication features
- `ui.*` - UI component features
- `analytics.*` - Analytics features
- `mobile.*` - Mobile app features

---

## Creating a New Template

1. Create a new directory under `/templates/`
2. Add `config.json` with the required schema
3. Add `README.md` with template documentation
4. Reference valid feature slugs from FEATURE_REGISTRY.md
5. Set appropriate pricing and tier

---

## Pricing Guidelines

- BASIC tier: $0 (free)
- STARTER tier: $29-$99
- PRO tier: $99-$199
- BUSINESS tier: $199-$399
- ENTERPRISE tier: $399+

Templates should offer 20-30% savings vs purchasing features individually.

---

_Last Updated: 2026-02-10_
