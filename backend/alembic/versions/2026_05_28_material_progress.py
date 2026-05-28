"""Create material progress table

Revision ID: 2026_05_28_material_progress
Revises: 2026_05_28_initial
Create Date: 2026-05-28 17:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2026_05_28_material_progress'
down_revision: Union[str, None] = '2026_05_28_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create material_progress table
    op.create_table(
        'material_progress',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('material_id', sa.UUID(), nullable=False),
        sa.Column('institution_id', sa.UUID(), nullable=False),
        sa.Column('position', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['material_id'], ['materials.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'material_id', name='uq_user_material_progress')
    )
    
    # Indexes
    op.create_index('idx_material_progress_user', 'material_progress', ['user_id'])
    op.create_index('idx_material_progress_material', 'material_progress', ['material_id'])
    op.create_index('idx_material_progress_institution', 'material_progress', ['institution_id'])


def downgrade() -> None:
    op.drop_index('idx_material_progress_institution', table_name='material_progress')
    op.drop_index('idx_material_progress_material', table_name='material_progress')
    op.drop_index('idx_material_progress_user', table_name='material_progress')
    op.drop_table('material_progress')
