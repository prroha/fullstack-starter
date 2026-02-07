# Deployment & Server Cheatsheet

> Production-Grade Deployment Best Practices (2025–2026 Edition)

---

## Core Philosophy

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   🎯 Review this cheatsheet before every major release              │
│                                                                     │
│   🚀 Start with managed platforms if solo/small team                │
│      → Add complexity (Kubernetes, IaC) only when needed            │
│                                                                     │
│   🔁 Aim for repeatable, boring, automated deployments              │
│      → If deployment is exciting, something is wrong                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Team Size → Deployment Complexity

| Team Size | Recommended Stack | When to Level Up |
|-----------|-------------------|------------------|
| **Solo / 1-2** | Vercel, Render, Railway, Fly.io | Never, unless scale demands |
| **Small (3-5)** | Managed containers (ECS, Cloud Run) | When you need multi-service orchestration |
| **Medium (5-15)** | Kubernetes (managed: EKS, GKE, AKS) | When you have dedicated DevOps |
| **Large (15+)** | Full IaC, multi-cluster, service mesh | When complexity pays for itself |

**Remember**: The best infrastructure is the one you don't have to think about.

---

## 1. Deployment Strategy

### Deployment Models
| Model | Best For | Examples | Tradeoffs |
|-------|----------|----------|-----------|
| **PaaS** | Startups, MVPs, small teams | Vercel, Render, Railway, Fly.io | Fast setup, less control, can get expensive |
| **Containers** | Scale, control, microservices | Docker + K8s, ECS, Cloud Run | More complex, full control |
| **Serverless** | Event-driven, variable load | Lambda, Vercel Functions, Cloudflare Workers | Cold starts, vendor lock-in |
| **VMs** | Legacy, specific requirements | EC2, DigitalOcean, Linode | Full control, more ops work |

### Environment Strategy
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Development │ → │   Staging   │ → │ Production  │
└─────────────┘    └─────────────┘    └─────────────┘
     Local           ≈ Production       Production

Critical: Staging must mirror production
- Same database version
- Same environment variables (different values)
- Same infrastructure (scaled down)
- Same deployment process
```

### Infrastructure as Code
| Tool | Cloud | Language |
|------|-------|----------|
| **Terraform** | Multi-cloud | HCL |
| **Pulumi** | Multi-cloud | TypeScript, Python, Go |
| **AWS CDK** | AWS | TypeScript, Python |
| **CloudFormation** | AWS | YAML/JSON |

```hcl
# Terraform example
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name        = "web-server"
    Environment = "production"
  }
}
```

### Checklist
- [ ] Environments defined (dev, staging, prod)
- [ ] Staging ≈ production configuration
- [ ] Infrastructure as Code for reproducibility
- [ ] Deployment model chosen based on needs
- [ ] Cost estimation done

---

## 2. Containerization (Docker)

### Dockerfile Best Practices
```dockerfile
# Multi-stage build for Node.js
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copy only what's needed
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### .dockerignore
```
# Dependencies
node_modules
npm-debug.log

# Build artifacts
dist
.next
.nuxt

# Git
.git
.gitignore

# IDE
.vscode
.idea

# Tests
__tests__
*.test.ts
coverage

# Environment
.env*
!.env.example

# Docker
Dockerfile*
docker-compose*

# Documentation
*.md
docs
```

### Docker Compose (Development)
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: builder  # Use builder stage for dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/app
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - db
      - redis
    command: npm run dev

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Image Security
```bash
# Scan for vulnerabilities
docker scout cves myapp:latest
trivy image myapp:latest
snyk container test myapp:latest

# Check image size
docker images myapp:latest

# View image layers
docker history myapp:latest
```

### Docker Checklist
- [ ] Multi-stage builds (small final image)
- [ ] .dockerignore configured
- [ ] Run as non-root user
- [ ] Official/trusted base images
- [ ] Pinned versions (not `latest`)
- [ ] Health check defined
- [ ] Image scanned for vulnerabilities
- [ ] Labels added (version, commit, date)
- [ ] Secrets NOT in image

---

## 3. CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ============================================
  # Lint & Type Check
  # ============================================
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

  # ============================================
  # Test
  # ============================================
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: always()

  # ============================================
  # Build & Push Docker Image
  # ============================================
  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=semver,pattern={{version}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Scan image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'

  # ============================================
  # Deploy to Staging
  # ============================================
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: staging
      url: https://staging.example.com

    steps:
      - name: Deploy to staging
        run: |
          # Example: Deploy to Kubernetes
          kubectl set image deployment/app \
            app=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            --namespace staging

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/app --namespace staging --timeout=5m

      - name: Smoke test
        run: |
          curl -f https://staging.example.com/health || exit 1

  # ============================================
  # Deploy to Production (Manual Approval)
  # ============================================
  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://example.com

    steps:
      - name: Deploy to production
        run: |
          kubectl set image deployment/app \
            app=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            --namespace production

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/app --namespace production --timeout=5m

      - name: Health check
        run: |
          curl -f https://example.com/health || exit 1
```

### Pipeline Stages
```
┌──────┐   ┌──────┐   ┌───────┐   ┌──────┐   ┌────────┐   ┌────────────┐
│ Lint │ → │ Test │ → │ Build │ → │ Scan │ → │ Deploy │ → │ Smoke Test │
└──────┘   └──────┘   └───────┘   └──────┘   └────────┘   └────────────┘
                                                 ↓
                                          ┌──────────┐
                                          │ Rollback │ (if failed)
                                          └──────────┘
```

### CI/CD Checklist
- [ ] Lint and type check on every PR
- [ ] Tests run on every PR
- [ ] Build on merge to main
- [ ] Security scan on images/dependencies
- [ ] Auto-deploy to staging
- [ ] Manual approval for production
- [ ] Rollback mechanism ready
- [ ] Secrets stored securely (GitHub Secrets)
- [ ] Cache configured for faster builds

---

## 4. Deployment Techniques

### Rolling Updates (Default)
```yaml
# Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Max pods over desired
      maxUnavailable: 0  # Always keep all pods running
  template:
    spec:
      containers:
        - name: app
          image: myapp:v2
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

### Blue-Green Deployment
```
┌─────────────────────────────────────────────┐
│               Load Balancer                  │
└─────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌─────────────────┐
│  Blue (v1.0)    │      │  Green (v1.1)   │
│  ✓ Active       │      │  Standby/Test   │
└─────────────────┘      └─────────────────┘

1. Deploy new version to Green
2. Test Green
3. Switch traffic from Blue to Green
4. Keep Blue for instant rollback
```

### Canary Deployment
```yaml
# Istio VirtualService for canary
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: app
spec:
  hosts:
    - app.example.com
  http:
    - route:
        - destination:
            host: app
            subset: stable
          weight: 90
        - destination:
            host: app
            subset: canary
          weight: 10  # 10% to new version
```

### Feature Flags
```typescript
// Feature flag check
import { featureFlags } from '@/lib/feature-flags';

async function processPayment(order: Order) {
  if (await featureFlags.isEnabled('new-payment-flow', { userId: order.userId })) {
    return newPaymentFlow(order);
  }
  return legacyPaymentFlow(order);
}

// Gradual rollout
// Day 1: 5% of users
// Day 2: 25% of users
// Day 3: 50% of users
// Day 4: 100% of users
```

### Graceful Shutdown
```typescript
// Handle SIGTERM for graceful shutdown
const server = app.listen(3000);

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);

  // Stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed');
  });

  // Wait for existing requests (with timeout)
  const timeout = setTimeout(() => {
    console.log('Forcing shutdown after timeout');
    process.exit(1);
  }, 30000);

  try {
    // Close database connections
    await prisma.$disconnect();

    // Close Redis
    await redis.quit();

    // Close message queue
    await queue.close();

    clearTimeout(timeout);
    console.log('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

### Health Checks
```typescript
// Liveness: Is the process alive?
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Readiness: Can it handle traffic?
app.get('/health/ready', async (req, res) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis
    await redis.ping();

    // Check external dependencies
    // await checkExternalService();

    res.status(200).json({
      status: 'ready',
      checks: {
        database: 'ok',
        redis: 'ok'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message
    });
  }
});

// Startup: Has initialization completed?
app.get('/health/startup', (req, res) => {
  if (appReady) {
    res.status(200).json({ status: 'started' });
  } else {
    res.status(503).json({ status: 'starting' });
  }
});
```

---

## 5. Kubernetes Basics

### Essential Resources
```yaml
# Namespace
apiVersion: v1
kind: Namespace
metadata:
  name: production

---
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: app
          image: ghcr.io/myorg/myapp:v1.0.0
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database-url
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health/live
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5

---
# Service
apiVersion: v1
kind: Service
metadata:
  name: app
  namespace: production
spec:
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP

---
# Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app
  namespace: production
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - api.example.com
      secretName: api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: app
                port:
                  number: 80

---
# HorizontalPodAutoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### Secrets Management
```yaml
# Secret (base64 encoded)
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: production
type: Opaque
data:
  database-url: cG9zdGdyZXNxbDovL3VzZXI6cGFzc0Bob3N0OjU0MzIvZGI=

# Or use External Secrets Operator for AWS/GCP/Azure secrets
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: app-secrets
  data:
    - secretKey: database-url
      remoteRef:
        key: production/app/database-url
```

### Useful Commands
```bash
# Apply configuration
kubectl apply -f deployment.yaml

# Check status
kubectl get pods -n production
kubectl get deployments -n production
kubectl describe pod <pod-name> -n production

# View logs
kubectl logs -f <pod-name> -n production
kubectl logs -f deployment/app -n production

# Execute into pod
kubectl exec -it <pod-name> -n production -- /bin/sh

# Rollback
kubectl rollout undo deployment/app -n production
kubectl rollout status deployment/app -n production

# Scale
kubectl scale deployment/app --replicas=5 -n production
```

---

## 6. Configuration & Secrets

### Environment Variables
```typescript
// config.ts - Centralized configuration
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url().optional(),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),

  // External services
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  SENDGRID_API_KEY: z.string().optional(),

  // Feature flags
  FEATURE_NEW_CHECKOUT: z.coerce.boolean().default(false),
});

// Validate on startup
const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('Invalid environment variables:');
  console.error(result.error.format());
  process.exit(1);
}

export const config = result.data;
```

### Secrets Managers
| Service | Cloud | Features |
|---------|-------|----------|
| **AWS Secrets Manager** | AWS | Rotation, versioning, cross-account |
| **GCP Secret Manager** | GCP | Versioning, IAM integration |
| **Azure Key Vault** | Azure | HSM-backed, certificates |
| **HashiCorp Vault** | Any | Dynamic secrets, policies, audit |
| **Doppler** | Any | Developer-friendly, sync |
| **1Password** | Any | Team secrets, CLI integration |

### Secrets Best Practices
- [ ] Never commit secrets to version control
- [ ] Use `.env.example` with placeholder values
- [ ] Different secrets per environment
- [ ] Rotate secrets regularly
- [ ] Audit secret access
- [ ] Minimal secret scope (least privilege)
- [ ] Encrypt secrets at rest

---

## 7. Reverse Proxy & Load Balancing

### Nginx Configuration
```nginx
# /etc/nginx/nginx.conf

upstream backend {
    least_conn;  # Load balancing method
    server app1:3000 weight=3;
    server app2:3000 weight=2;
    server app3:3000 backup;

    keepalive 32;
}

server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    # SSL
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'" always;

    # Gzip
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    gzip_min_length 1000;

    # Proxy to backend
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer settings
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
    }

    # Static files
    location /static {
        alias /var/www/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check (don't log)
    location /health {
        access_log off;
        proxy_pass http://backend;
    }
}
```

### Traefik (Docker/Kubernetes)
```yaml
# docker-compose with Traefik
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt

  app:
    image: myapp:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`api.example.com`)"
      - "traefik.http.routers.app.entrypoints=websecure"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"
      - "traefik.http.services.app.loadbalancer.server.port=3000"

volumes:
  letsencrypt:
```

---

## 8. SSL/TLS & HTTPS

### Let's Encrypt (Certbot)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d example.com -d www.example.com

# Auto-renewal (usually configured automatically)
sudo certbot renew --dry-run

# Cron for renewal
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### cert-manager (Kubernetes)
```yaml
# ClusterIssuer for Let's Encrypt
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    email: admin@example.com
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx

---
# Certificate
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: api-tls
  namespace: production
spec:
  secretName: api-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - api.example.com
    - www.api.example.com
```

### SSL Best Practices
- [ ] TLS 1.2+ only (disable TLS 1.0, 1.1)
- [ ] Strong cipher suites
- [ ] HSTS enabled (with preload for production)
- [ ] Certificate auto-renewal configured
- [ ] OCSP stapling enabled
- [ ] Test with SSL Labs (aim for A+)

---

## 9. CDN & Static Assets

### CDN Providers
| Provider | Best For | Features |
|----------|----------|----------|
| **Cloudflare** | General, free tier | DDoS, WAF, Workers |
| **AWS CloudFront** | AWS ecosystem | S3 integration, Lambda@Edge |
| **Fastly** | Real-time purge | VCL configuration |
| **BunnyCDN** | Cost-effective | Simple, fast |
| **Vercel Edge** | Next.js apps | Integrated |

### Cloudflare Configuration
```
Page Rules:
1. *.example.com/api/* → Cache Level: Bypass
2. *.example.com/static/* → Cache Level: Cache Everything, Edge TTL: 1 month
3. *.example.com/* → Cache Level: Standard

Cache-Control Headers:
- Static assets: public, max-age=31536000, immutable
- API responses: private, no-store (or short TTL for public data)
- HTML pages: public, max-age=0, must-revalidate
```

### Cache Headers
```typescript
// Immutable static assets (hashed filenames)
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

// Dynamic API data
res.setHeader('Cache-Control', 'private, no-store');

// Public API data (cacheable)
res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');

// HTML pages
res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
```

---

## 10. Monitoring & Observability

### The Three Pillars
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    Logs     │  │   Metrics   │  │   Traces    │
│  (Events)   │  │ (Numbers)   │  │ (Requests)  │
└─────────────┘  └─────────────┘  └─────────────┘
     Loki           Prometheus       Jaeger
     ELK            Grafana          Zipkin
     CloudWatch     Datadog          Tempo
```

### Prometheus Metrics
```typescript
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const registry = new Registry();

// HTTP request metrics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [registry],
});

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [registry],
});

// Business metrics
const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
  registers: [registry],
});

// Middleware
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: req.route?.path || 'unknown',
      status: res.statusCode,
    };
    end(labels);
    httpRequestTotal.inc(labels);
  });

  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
});
```

### Grafana Dashboard (Key Panels)
```
┌─────────────────────────────────────────────────┐
│  Request Rate (RPS)     │  Error Rate (%)       │
├─────────────────────────────────────────────────┤
│  Latency (p50/p95/p99)  │  Active Connections   │
├─────────────────────────────────────────────────┤
│  CPU Usage              │  Memory Usage         │
├─────────────────────────────────────────────────┤
│  Database Connections   │  Cache Hit Rate       │
└─────────────────────────────────────────────────┘
```

### Alerting Rules
```yaml
# Prometheus alerting rules
groups:
  - name: app
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: HighLatency
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
          ) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "P95 latency is {{ $value }}s"

      - alert: PodCrashLooping
        expr: |
          increase(kube_pod_container_status_restarts_total[1h]) > 3
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Pod is crash looping"
```

### Error Tracking (Sentry)
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.GIT_SHA,
  tracesSampleRate: 0.1,  // 10% of transactions
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    new Sentry.Integrations.Prisma({ client: prisma }),
  ],
});

// Error handler middleware (after all routes)
app.use(Sentry.Handlers.errorHandler());
```

### Monitoring Checklist
- [ ] Structured logging to central system
- [ ] Metrics exposed (Prometheus format)
- [ ] Dashboards for key metrics
- [ ] Alerting on errors, latency, saturation
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring
- [ ] Distributed tracing for complex flows

---

## 11. Scaling & Performance

### Horizontal Scaling Readiness
```
Stateless Checklist:
✓ No local file storage (use S3/object storage)
✓ No in-memory sessions (use Redis)
✓ No local cache that needs sync (use Redis)
✓ No sticky sessions required
✓ Database connection pooling
```

### Auto-Scaling Configuration
```yaml
# Kubernetes HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app
  minReplicas: 2
  maxReplicas: 20
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: External
      external:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"
```

### Database Scaling
```
Read-Heavy Workloads:
┌─────────────┐
│   Primary   │ ──writes──→
└─────────────┘
       │
       │ replication
       ▼
┌─────────────┐   ┌─────────────┐
│  Replica 1  │   │  Replica 2  │ ──reads──→
└─────────────┘   └─────────────┘

Connection Pooling:
App → PgBouncer → PostgreSQL
     (100s)        (20 actual)
```

### Caching Strategy
```
Cache Layers:
1. Browser cache (static assets)
2. CDN cache (static + some API responses)
3. Application cache (Redis)
   - Sessions
   - Computed data
   - Rate limiting
4. Database query cache
```

---

## 12. Security Hardening

### Server Hardening
```bash
# Disable root SSH
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# SSH key only (no password)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Firewall (allow only necessary ports)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Fail2ban for brute force protection
sudo apt install fail2ban
sudo systemctl enable fail2ban

# Automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

### Container Security
```yaml
# Pod Security Context
apiVersion: v1
kind: Pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 1000
  containers:
    - name: app
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
```

### Network Security
```yaml
# Network Policy (allow only necessary traffic)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: app-network-policy
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: nginx-ingress
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - protocol: TCP
          port: 6379
```

### Security Checklist
- [ ] SSH key-only authentication
- [ ] Firewall configured (minimal ports)
- [ ] Fail2ban or equivalent
- [ ] Automatic security updates
- [ ] Containers run as non-root
- [ ] Network policies restrict traffic
- [ ] Secrets encrypted at rest
- [ ] Regular vulnerability scans
- [ ] Least privilege IAM roles

---

## 13. Disaster Recovery

### Backup Strategy
```
                      ┌─────────────────┐
                      │  Backup Types   │
                      └─────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    Daily      │   │    Weekly     │   │    Monthly    │
│  (7 copies)   │   │  (4 copies)   │   │  (12 copies)  │
└───────────────┘   └───────────────┘   └───────────────┘
```

### Recovery Time Objectives
| Tier | RTO | RPO | Strategy |
|------|-----|-----|----------|
| **Critical** | < 1 hour | < 5 minutes | Multi-region, real-time replication |
| **High** | < 4 hours | < 1 hour | Hot standby, frequent backups |
| **Medium** | < 24 hours | < 24 hours | Daily backups, documented recovery |
| **Low** | < 72 hours | < 7 days | Weekly backups |

### Runbook Template
```markdown
# Incident: Database Failure

## Detection
- Alert: PostgreSQL connection failures
- Metrics: Connection count = 0

## Immediate Actions
1. Check database pod/instance status
2. Check recent deployments/changes
3. Review database logs

## Recovery Steps

### Option A: Restart
kubectl rollout restart deployment/postgres -n production

### Option B: Restore from Backup
1. Stop application traffic
   kubectl scale deployment/app --replicas=0
2. Restore database
   pg_restore -h db-host -U admin -d mydb latest-backup.dump
3. Verify data integrity
   SELECT count(*) FROM users;
4. Resume traffic
   kubectl scale deployment/app --replicas=3

## Post-Incident
- [ ] Root cause analysis
- [ ] Update runbook if needed
- [ ] Review monitoring/alerting
```

### DR Checklist
- [ ] Backups automated and tested
- [ ] RTO/RPO defined per service
- [ ] Runbooks documented
- [ ] DR drill performed quarterly
- [ ] Multi-region for critical services
- [ ] Secrets backed up securely

---

## Pre-Launch Deployment Checklist

### Infrastructure
- [ ] HTTPS enforced (HSTS enabled)
- [ ] SSL certificate auto-renewal
- [ ] Security headers configured
- [ ] CDN configured for static assets
- [ ] Load balancer health checks
- [ ] DNS configured and verified

### Security
- [ ] Secrets in secret manager (not env files)
- [ ] Firewall rules minimal
- [ ] SSH key-only access
- [ ] Container security context
- [ ] Dependency vulnerabilities scanned
- [ ] No exposed ports except 443

### Reliability
- [ ] Health endpoints working
- [ ] Graceful shutdown implemented
- [ ] Auto-scaling configured
- [ ] Rollback tested
- [ ] Backups automated and tested

### Observability
- [ ] Logs flowing to central system
- [ ] Metrics exposed and scraped
- [ ] Dashboards created
- [ ] Alerts configured
- [ ] Error tracking active
- [ ] Uptime monitoring enabled

### CI/CD
- [ ] Pipeline passing
- [ ] Tests run on every PR
- [ ] Auto-deploy to staging
- [ ] Manual approval for production
- [ ] Rollback mechanism ready

### Performance
- [ ] Load test passed
- [ ] Response times acceptable
- [ ] Database connections pooled
- [ ] Caching configured

---

## Resources

- [12 Factor App](https://12factor.net/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [OWASP Deployment Security](https://owasp.org/www-project-devsecops-guideline/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

*Last updated: February 2026*
