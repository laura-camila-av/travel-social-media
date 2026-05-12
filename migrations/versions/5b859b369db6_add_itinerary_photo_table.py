"""add itinerary photo table

Revision ID: 5b859b369db6
Revises: 5f2fb1ed177a
Create Date: 2026-05-12 15:18:59.533882

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5b859b369db6'
down_revision = '5f2fb1ed177a'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'itinerary_photo',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('itinerary_day_id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.ForeignKeyConstraint(['itinerary_day_id'], ['itinerary_day.id']),
        sa.PrimaryKeyConstraint('id')
    )

    with op.batch_alter_table('itinerary_day', schema=None) as batch_op:
        batch_op.drop_column('photo_filename')


def downgrade():
    with op.batch_alter_table('itinerary_day', schema=None) as batch_op:
        batch_op.add_column(sa.Column('photo_filename', sa.VARCHAR(length=255), nullable=True))

    op.drop_table('itinerary_photo')