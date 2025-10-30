from django.contrib.postgres.operations import TrigramExtension, UnaccentExtension
from django.db import migrations


INDEX_NAME = "movie_primary_title_trgm_idx"


def _create_trgm_index(apps, schema_editor) -> None:
    if schema_editor.connection.vendor != "postgresql":
        return

    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            f"""
            CREATE INDEX CONCURRENTLY IF NOT EXISTS {INDEX_NAME}
            ON movie
            USING gin (immutable_unaccent(lower(primary_title)) gin_trgm_ops);
            """
        )


def _drop_trgm_index(apps, schema_editor) -> None:
    if schema_editor.connection.vendor != "postgresql":
        return

    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            f"DROP INDEX CONCURRENTLY IF EXISTS {INDEX_NAME};"
        )


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("movies", "0001_initial"),
    ]

    operations = [
        UnaccentExtension(),
        TrigramExtension(),
        migrations.RunPython(_create_trgm_index, reverse_code=_drop_trgm_index),
    ]
