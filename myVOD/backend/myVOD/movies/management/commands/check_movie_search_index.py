import unicodedata
from typing import Iterable

from django.core.management.base import BaseCommand
from django.db import connection


CHECK_INDEX_SQL = """
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'movie'
  AND indexname = %s;
"""

CHECK_EXTENSION_SQL = """
SELECT extname
FROM pg_extension
WHERE extname IN ('pg_trgm', 'unaccent');
"""

EXPLAIN_ANALYZE_SQL = """
EXPLAIN ANALYZE
SELECT tconst, primary_title
FROM movie
WHERE similarity(
        immutable_unaccent(lower(primary_title)),
        immutable_unaccent(lower(%s))
      ) > 0.1
ORDER BY
    similarity(
        immutable_unaccent(lower(primary_title)),
        immutable_unaccent(lower(%s))
    ) DESC,
    avg_rating DESC,
    start_year DESC
LIMIT %s;
"""


def _print_lines(command: BaseCommand, lines: Iterable[str]) -> None:
    for line in lines:
        command.stdout.write(f"  {line}")


def _normalize_search_query(query: str) -> str:
    normalized = unicodedata.normalize('NFKD', query.lower())
    return ''.join(ch for ch in normalized if not unicodedata.combining(ch))


class Command(BaseCommand):
    help = (
        "Verify that the trigram index for movie search exists and show EXPLAIN ANALYZE "
        "output for a sample query."
    )

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--search",
            default="Matrix",
            help="Sample query string used for the EXPLAIN ANALYZE run (default: 'Matrix')",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=10,
            help="LIMIT value for the sample EXPLAIN ANALYZE query (default: 10)",
        )

    def handle(self, *args, **options) -> None:
        search_term: str = options["search"]
        limit: int = options["limit"]

        with connection.cursor() as cursor:
            self.stdout.write("Checking required PostgreSQL extensions...")
            cursor.execute(CHECK_EXTENSION_SQL)
            extensions = {row[0] for row in cursor.fetchall()}

            missing_extensions = {"pg_trgm", "unaccent"} - extensions
            if missing_extensions:
                self.stdout.write(self.style.WARNING(
                    f"Missing extensions detected: {', '.join(sorted(missing_extensions))}."
                ))
            else:
                self.stdout.write(self.style.SUCCESS("Required extensions (pg_trgm, unaccent) are installed."))

            self.stdout.write("\nChecking trigram index presence...")
            cursor.execute(CHECK_INDEX_SQL, ["movie_primary_title_trgm_idx"])
            index_exists = cursor.fetchone() is not None

            if index_exists:
                self.stdout.write(self.style.SUCCESS("Index movie_primary_title_trgm_idx exists."))
            else:
                self.stdout.write(self.style.WARNING("Index movie_primary_title_trgm_idx is missing."))
                self.stdout.write(
                    "Run the following SQL to create it (requires superuser privileges):"
                )
                _print_lines(self, [
                    "CREATE INDEX CONCURRENTLY movie_primary_title_trgm_idx",
                    "  ON movie USING gin (public.immutable_unaccent(lower(primary_title)) gin_trgm_ops);",
                ])

            normalized_search = _normalize_search_query(search_term)

            self.stdout.write("")
            self.stdout.write(
                f"Running EXPLAIN ANALYZE for sample query '{search_term}' (normalized: '{normalized_search}')"
            )
            cursor.execute(EXPLAIN_ANALYZE_SQL, [normalized_search, normalized_search, limit])
            explain_rows = [row[0] for row in cursor.fetchall()]
            _print_lines(self, explain_rows)

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Check completed."))

