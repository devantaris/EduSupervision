"""Initial schema migration

Revision ID: 2026_05_28_initial
Revises: 
Create Date: 2026-05-28 17:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = '2026_05_28_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # 2. Create Institutions Table
    op.create_table(
        'institutions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index('idx_institutions_code', 'institutions', ['code'])

    # 3. Create Users Table
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='pending_verification', nullable=False),
        sa.Column('institution_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_institution', 'users', ['institution_id'])

    # 4. Create Profiles Table
    op.create_table(
        'profiles',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('employee_id', sa.String(length=50), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index('idx_profiles_user', 'profiles', ['user_id'])

    # 5. Create Materials Table
    op.create_table(
        'materials',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('institution_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('file_url', sa.String(length=512), nullable=False),
        sa.Column('uploader_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploader_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_materials_institution', 'materials', ['institution_id'])
    op.create_index('idx_materials_uploader', 'materials', ['uploader_id'])

    # 6. Create Assignments Table
    op.create_table(
        'assignments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('institution_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('rubric', sa.JSON(), nullable=False),
        sa.Column('max_score', sa.Integer(), nullable=False),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('creator_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['creator_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_assignments_institution', 'assignments', ['institution_id'])
    op.create_index('idx_assignments_creator', 'assignments', ['creator_id'])

    # 7. Create Submissions Table
    op.create_table(
        'submissions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('assignment_id', sa.UUID(), nullable=False),
        sa.Column('teacher_id', sa.UUID(), nullable=False),
        sa.Column('institution_id', sa.UUID(), nullable=False),
        sa.Column('s3_key', sa.String(length=512), nullable=False),
        sa.Column('file_mime', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('extracted_text', sa.Text(), nullable=True),
        sa.Column('embedding', Vector(dim=768), nullable=True),
        sa.Column('minhash_sig', sa.ARRAY(sa.Integer()), nullable=True),
        sa.Column('score_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['assignment_id'], ['assignments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['teacher_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_submissions_assignment', 'submissions', ['assignment_id'])
    op.create_index('idx_submissions_teacher', 'submissions', ['teacher_id'])
    op.create_index('idx_submissions_institution', 'submissions', ['institution_id'])
    op.create_index('idx_submissions_status', 'submissions', ['status'])
    
    # HNSW Index for pgvector
    op.execute(
        "CREATE INDEX idx_submissions_embedding ON submissions USING hnsw (embedding vector_cosine_ops) WITH (m=16, ef_construction=64)"
    )

    # 8. Create AI Evaluations Table
    op.create_table(
        'ai_evaluations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('submission_id', sa.UUID(), nullable=False),
        sa.Column('scores', sa.JSON(), nullable=False),
        sa.Column('overall_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('feedback', sa.Text(), nullable=False),
        sa.Column('recommendations', sa.JSON(), nullable=False),
        sa.Column('tokens_used', sa.Integer(), nullable=False),
        sa.Column('evaluated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('submission_id')
    )
    op.create_index('idx_ai_evaluations_submission', 'ai_evaluations', ['submission_id'])

    # 9. Create Audit Logs Table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_audit_logs_user', 'audit_logs', ['user_id'])
    op.create_index('idx_audit_logs_action', 'audit_logs', ['action'])


def downgrade() -> None:
    op.drop_index('idx_audit_logs_action', table_name='audit_logs')
    op.drop_index('idx_audit_logs_user', table_name='audit_logs')
    op.drop_table('audit_logs')
    
    op.drop_index('idx_ai_evaluations_submission', table_name='ai_evaluations')
    op.drop_table('ai_evaluations')
    
    op.execute("DROP INDEX IF EXISTS idx_submissions_embedding")
    op.drop_index('idx_submissions_status', table_name='submissions')
    op.drop_index('idx_submissions_institution', table_name='submissions')
    op.drop_index('idx_submissions_teacher', table_name='submissions')
    op.drop_index('idx_submissions_assignment', table_name='submissions')
    op.drop_table('submissions')
    
    op.drop_index('idx_assignments_creator', table_name='assignments')
    op.drop_index('idx_assignments_institution', table_name='assignments')
    op.drop_table('assignments')
    
    op.drop_index('idx_materials_uploader', table_name='materials')
    op.drop_index('idx_materials_institution', table_name='materials')
    op.drop_table('materials')
    
    op.drop_index('idx_profiles_user', table_name='profiles')
    op.drop_table('profiles')
    
    op.drop_index('idx_users_institution', table_name='users')
    op.drop_index('idx_users_email', table_name='users')
    op.drop_table('users')
    
    op.drop_index('idx_institutions_code', table_name='institutions')
    op.drop_table('institutions')
    
    op.execute("DROP EXTENSION IF EXISTS vector")
