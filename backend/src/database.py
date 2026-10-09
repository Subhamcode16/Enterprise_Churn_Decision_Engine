"""
VALENCE Persistence & Database Layer
SQLAlchemy 2.0 ORM with SQLite local storage and PostgreSQL cloud compatibility.
"""

import os
import logging
from datetime import datetime, timezone
from typing import Generator
from sqlalchemy import (
    create_engine, 
    Column, 
    Integer, 
    String, 
    Float, 
    Boolean, 
    DateTime, 
    Text,
    event
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session

logger = logging.getLogger("valence.database")

RAW_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/valence.db")

# Normalize postgres URL for SQLAlchemy 2.0 (prefer psycopg3 / psycopg2)
DATABASE_URL = RAW_DATABASE_URL
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)


def create_app_engine(db_url: str):
    if db_url.startswith("sqlite"):
        os.makedirs("./data", exist_ok=True)
        sqlite_engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False}
        )
        @event.listens_for(sqlite_engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            try:
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA journal_mode=WAL")
                cursor.execute("PRAGMA synchronous=NORMAL")
                cursor.close()
            except Exception:
                pass
        return sqlite_engine
    else:
        # PostgreSQL with fallback protection
        try:
            pg_engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
                pool_recycle=300
            )
            return pg_engine
        except Exception as e:
            logger.warning(f"PostgreSQL engine creation failed ({e}). Falling back to local SQLite.")
            os.makedirs("./data", exist_ok=True)
            return create_engine(
                "sqlite:///./data/valence.db",
                connect_args={"check_same_thread": False}
            )


engine = create_app_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    """Operator / Executive User Account for RBAC"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(100), default="default_tenant", index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    salt = Column(String(64), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="operator", nullable=False)  # admin, operator, executive
    auth_provider = Column(String(50), default="email", nullable=False)  # google, apple, x, email, sso
    provider_user_id = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    last_login = Column(DateTime, nullable=True)


class TenantVault(Base):
    """Isolated Tenant Encrypted Workspace Records"""
    __tablename__ = "tenant_vaults"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True)
    tenant_id = Column(String(100), index=True, nullable=False)
    data_source = Column(String(50), nullable=False)  # csv, stripe, salesforce
    records_count = Column(Integer, default=0, nullable=False)
    encrypted_payload = Column(Text, nullable=True)
    schema_status = Column(String(50), default="verified", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class DispatchedPlaybookRecord(Base):
    """Audit Trail for SLA Retention Actions Partitioned by User/Tenant"""
    __tablename__ = "dispatched_playbooks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True)
    tenant_id = Column(String(100), default="default_tenant", index=True, nullable=False)
    account_id = Column(String(100), index=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    playbook_id = Column(String(50), nullable=False)
    priority = Column(String(20), default="P0", nullable=False)
    assignee_role = Column(String(100), default="Customer Success", nullable=False)
    sla_hours = Column(Integer, default=4, nullable=False)
    status = Column(String(50), default="active", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    deadline_at = Column(DateTime, nullable=True)


class AccountNoteRecord(Base):
    """Collaborative Notes on Enterprise Accounts Partitioned by User/Tenant"""
    __tablename__ = "account_notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True)
    tenant_id = Column(String(100), default="default_tenant", index=True, nullable=False)
    account_id = Column(String(100), index=True, nullable=False)
    author = Column(String(255), default="CS Lead", nullable=False)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class CustomUserAccountRecord(Base):
    """Per-User Custom / Uploaded Accounts Partition"""
    __tablename__ = "custom_user_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    tenant_id = Column(String(100), default="default_tenant", index=True, nullable=False)
    account_id = Column(String(100), index=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    contract_mrr = Column(Float, nullable=False)
    raw_payload = Column(Text, nullable=False)
    churn_probability = Column(Float, nullable=True)
    risk_tier = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class ModelTelemetryRecord(Base):
    """ML Training Telemetry and Model Evaluation Logs"""
    __tablename__ = "model_telemetry"

    id = Column(Integer, primary_key=True, index=True)
    model_version = Column(String(50), nullable=False)
    recall = Column(Float, nullable=False)
    roc_auc = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    total_training_samples = Column(Integer, nullable=False)
    trained_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class AuditLog(Base):
    """Security & Access Audit Trail"""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    tenant_id = Column(String(100), default="default_tenant", nullable=False)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(255), nullable=False)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


# Initialize Database Tables
def init_db():
    Base.metadata.create_all(bind=engine)
    # Auto-migration for SQLite schema updates if table existed prior to column additions
    if engine.dialect.name == "sqlite":
        try:
            with engine.connect() as conn:
                # users table
                res = conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()
                user_cols = [r[1] for r in res]
                if "tenant_id" not in user_cols and len(user_cols) > 0:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN tenant_id VARCHAR(100) DEFAULT 'default_tenant'")
                if "auth_provider" not in user_cols and len(user_cols) > 0:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'email'")
                if "provider_user_id" not in user_cols and len(user_cols) > 0:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN provider_user_id VARCHAR(255)")
                if "last_login" not in user_cols and len(user_cols) > 0:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN last_login TIMESTAMP")

                # dispatched_playbooks table
                res = conn.exec_driver_sql("PRAGMA table_info(dispatched_playbooks)").fetchall()
                pb_cols = [r[1] for r in res]
                if "user_id" not in pb_cols and len(pb_cols) > 0:
                    conn.exec_driver_sql("ALTER TABLE dispatched_playbooks ADD COLUMN user_id INTEGER")
                if "tenant_id" not in pb_cols and len(pb_cols) > 0:
                    conn.exec_driver_sql("ALTER TABLE dispatched_playbooks ADD COLUMN tenant_id VARCHAR(100) DEFAULT 'default_tenant'")

                # account_notes table
                res = conn.exec_driver_sql("PRAGMA table_info(account_notes)").fetchall()
                notes_cols = [r[1] for r in res]
                if "user_id" not in notes_cols and len(notes_cols) > 0:
                    conn.exec_driver_sql("ALTER TABLE account_notes ADD COLUMN user_id INTEGER")
                if "tenant_id" not in notes_cols and len(notes_cols) > 0:
                    conn.exec_driver_sql("ALTER TABLE account_notes ADD COLUMN tenant_id VARCHAR(100) DEFAULT 'default_tenant'")

                # audit_logs table
                res = conn.exec_driver_sql("PRAGMA table_info(audit_logs)").fetchall()
                audit_cols = [r[1] for r in res]
                if "user_id" not in audit_cols and len(audit_cols) > 0:
                    conn.exec_driver_sql("ALTER TABLE audit_logs ADD COLUMN user_id INTEGER")
                if "tenant_id" not in audit_cols and len(audit_cols) > 0:
                    conn.exec_driver_sql("ALTER TABLE audit_logs ADD COLUMN tenant_id VARCHAR(100) DEFAULT 'default_tenant'")
                
                conn.commit()
        except Exception:
            pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Backward compatibility aliases
PlaybookExecution = DispatchedPlaybookRecord
