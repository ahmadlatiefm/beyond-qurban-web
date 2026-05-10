--
-- PostgreSQL database dump
--

\restrict CZMblqTrlHarg1EsadKHZULoHlyf4I1aqPx3lzTUXpj5DtJDUDlPdSA5JnBNtKB

-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: beyond_qurban_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO beyond_qurban_user;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: beyond_qurban_user
--

INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('5055be23-1b38-4465-adbd-0e854c62a798', 'c2db3673a6169e7c381b4d612ccffccd5c711b5bda43463d343378536b810a36', '2026-05-06 10:55:20.793968+02', '20260501095127_init', '', NULL, '2026-05-06 10:55:20.793968+02', 0);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('31d3553b-f95c-4c69-bcb1-95a9ed20aa78', 'e3b63de96ea6ebc9a2ca8188128e6caa331408302189b8a073b1d73a970e0ecc', '2026-05-08 07:36:29.01424+02', '20260508053611_add_pengiriman', '', NULL, '2026-05-08 07:36:29.01424+02', 0);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: beyond_qurban_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict CZMblqTrlHarg1EsadKHZULoHlyf4I1aqPx3lzTUXpj5DtJDUDlPdSA5JnBNtKB

