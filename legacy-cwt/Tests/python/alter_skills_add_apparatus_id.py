import os
import sys
import psycopg

DB_URL = os.getenv("DATABASE_URL") or os.getenv("DATABASE_DIRECT_URL")
if not DB_URL:
    print("ERROR: DATABASE_URL (or DATABASE_DIRECT_URL) not set", file=sys.stderr)
    sys.exit(2)

def column_exists(cur) -> bool:
    cur.execute(
        """
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name='skills' AND column_name='apparatus_id'
        """
    )
    return cur.fetchone() is not None

def fk_exists(cur) -> bool:
    cur.execute(
        """
        SELECT 1
        FROM pg_constraint con
        JOIN pg_class cls ON cls.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = con.connamespace
        WHERE nsp.nspname='public' AND cls.relname='skills' AND con.contype='f'
          AND pg_get_constraintdef(con.oid) LIKE '%REFERENCES public.apparatus%'
        """
    )
    return cur.fetchone() is not None

def index_exists(cur) -> bool:
    cur.execute(
        """
        SELECT 1
        FROM pg_indexes
        WHERE schemaname='public' AND tablename='skills' AND indexname='idx_skills_apparatus_id'
        """
    )
    return cur.fetchone() is not None

with psycopg.connect(DB_URL) as conn:
    conn.execute("BEGIN")
    with conn.cursor() as cur:
        added_column = False
        added_fk = False
        added_index = False

        if not column_exists(cur):
            cur.execute("ALTER TABLE public.skills ADD COLUMN apparatus_id integer NULL")
            added_column = True

        if not fk_exists(cur):
            # Name the constraint deterministically
            cur.execute(
                "ALTER TABLE public.skills ADD CONSTRAINT skills_apparatus_id_fkey FOREIGN KEY (apparatus_id) REFERENCES public.apparatus(id) ON DELETE SET NULL"
            )
            added_fk = True

        if not index_exists(cur):
            cur.execute("CREATE INDEX idx_skills_apparatus_id ON public.skills(apparatus_id)")
            added_index = True

    conn.execute("COMMIT")

    print({
        "added_column": added_column,
        "added_fk": added_fk,
        "added_index": added_index,
    })
