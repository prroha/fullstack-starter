//! Seeds the database with a default admin user.
//!
//! Usage: cargo run --bin seed

use sqlx::postgres::PgPoolOptions;

use starter_backend::domain::services::PasswordHasher;
use starter_backend::infrastructure::auth::Argon2Hasher;

const DEFAULT_ADMIN_EMAIL: &str = "admin@example.com";
const DEFAULT_ADMIN_NAME: &str = "Admin";
const DEFAULT_ADMIN_PASSWORD: &str = "admin123456";

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    let database_url =
        std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&database_url)
        .await?;

    // Run migrations first
    sqlx::migrate::Migrator::new(std::path::Path::new("./migrations"))
        .await?
        .run(&pool)
        .await?;

    // Check if admin already exists
    let existing: Option<(String,)> =
        sqlx::query_as("SELECT email FROM users WHERE email = $1")
            .bind(DEFAULT_ADMIN_EMAIL)
            .fetch_optional(&pool)
            .await?;

    if existing.is_some() {
        println!("Admin user already exists: {DEFAULT_ADMIN_EMAIL}");
        return Ok(());
    }

    let hasher = Argon2Hasher;
    let password_hash = hasher
        .hash(DEFAULT_ADMIN_PASSWORD)
        .map_err(|e| anyhow::anyhow!("{e}"))?;

    sqlx::query(
        "INSERT INTO users (email, name, password_hash, role, email_verified) VALUES ($1, $2, $3, $4, true)",
    )
    .bind(DEFAULT_ADMIN_EMAIL)
    .bind(DEFAULT_ADMIN_NAME)
    .bind(&password_hash)
    .bind("admin")
    .execute(&pool)
    .await?;

    println!("Created admin user:");
    println!("  Email:    {DEFAULT_ADMIN_EMAIL}");
    println!("  Password: {DEFAULT_ADMIN_PASSWORD}");
    println!("  Role:     admin");
    println!();
    println!("IMPORTANT: Change the password after first login!");

    Ok(())
}
