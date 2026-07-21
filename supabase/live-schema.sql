-- DDL real de la base de datos en produccion, esquema public.
-- Obtenido el 2026-07-21 con:
--   pg_dump --schema-only --no-owner --no-privileges --schema=public
-- Este es el fichero autoritativo. supabase/schema.sql NO lo es.
-- Se omiten los esquemas internos de Supabase (auth, storage, realtime,
-- vault, graphql, extensions, pgbouncer): no se migran al VPS.

--
-- PostgreSQL database dump
--

\restrict B1y9Ilb6o1jf2oWpF0l4p6YUqxwI5yzU0wqTmi3nA4DSTNVMBHK6lsTEHpjzPrl

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: set_completed_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_completed_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.is_completed = true AND (OLD.is_completed = false OR OLD.is_completed IS NULL) THEN
    NEW.completed_at = now();
  ELSIF NEW.is_completed = false THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_subitems_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_subitems_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: invite_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invite_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    list_id uuid NOT NULL,
    code character varying(12) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    list_id uuid NOT NULL,
    name character varying(500) NOT NULL,
    is_completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    "position" integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    "position" integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: premium_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.premium_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(16) NOT NULL,
    stripe_session_id character varying(255),
    used_at timestamp with time zone,
    redeemed_by_workspace_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: rate_limit_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_limit_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ip_address character varying(45) NOT NULL,
    success boolean DEFAULT false,
    attempted_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: workspaces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workspaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    passphrase_hash text NOT NULL,
    passphrase_lookup text NOT NULL,
    tier character varying(10) DEFAULT 'free'::character varying,
    premium_expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: invite_codes invite_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_code_key UNIQUE (code);


--
-- Name: invite_codes invite_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: lists lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT lists_pkey PRIMARY KEY (id);


--
-- Name: premium_codes premium_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.premium_codes
    ADD CONSTRAINT premium_codes_code_key UNIQUE (code);


--
-- Name: premium_codes premium_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.premium_codes
    ADD CONSTRAINT premium_codes_pkey PRIMARY KEY (id);


--
-- Name: rate_limit_attempts rate_limit_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limit_attempts
    ADD CONSTRAINT rate_limit_attempts_pkey PRIMARY KEY (id);


--
-- Name: workspaces workspaces_passphrase_lookup_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_passphrase_lookup_key UNIQUE (passphrase_lookup);


--
-- Name: workspaces workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_pkey PRIMARY KEY (id);


--
-- Name: idx_invite_codes_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invite_codes_code ON public.invite_codes USING btree (code);


--
-- Name: idx_invite_codes_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invite_codes_expires ON public.invite_codes USING btree (expires_at);


--
-- Name: idx_invite_codes_list_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invite_codes_list_id ON public.invite_codes USING btree (list_id);


--
-- Name: idx_items_list_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_list_completed ON public.items USING btree (list_id, is_completed);


--
-- Name: idx_items_list_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_list_id ON public.items USING btree (list_id);


--
-- Name: idx_lists_workspace_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lists_workspace_id ON public.lists USING btree (workspace_id);


--
-- Name: idx_lists_workspace_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lists_workspace_position ON public.lists USING btree (workspace_id, "position");


--
-- Name: idx_premium_codes_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_premium_codes_code ON public.premium_codes USING btree (code);


--
-- Name: idx_rate_limit_attempted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limit_attempted_at ON public.rate_limit_attempts USING btree (attempted_at);


--
-- Name: idx_rate_limit_ip_success; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limit_ip_success ON public.rate_limit_attempts USING btree (ip_address, success, attempted_at);


--
-- Name: idx_workspaces_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workspaces_lookup ON public.workspaces USING btree (passphrase_lookup);


--
-- Name: idx_workspaces_tier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workspaces_tier ON public.workspaces USING btree (tier);


--
-- Name: items items_completed_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER items_completed_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.set_completed_at();


--
-- Name: items items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: lists lists_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER lists_updated_at BEFORE UPDATE ON public.lists FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: workspaces workspaces_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: invite_codes invite_codes_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.lists(id) ON DELETE CASCADE;


--
-- Name: items items_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.lists(id) ON DELETE CASCADE;


--
-- Name: lists lists_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lists
    ADD CONSTRAINT lists_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: premium_codes premium_codes_redeemed_by_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.premium_codes
    ADD CONSTRAINT premium_codes_redeemed_by_workspace_id_fkey FOREIGN KEY (redeemed_by_workspace_id) REFERENCES public.workspaces(id);


--
-- Name: invite_codes Anyone can use invite codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can use invite codes" ON public.invite_codes FOR SELECT USING (true);


--
-- Name: invite_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

--
-- Name: lists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

--
-- Name: rate_limit_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: workspaces; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict B1y9Ilb6o1jf2oWpF0l4p6YUqxwI5yzU0wqTmi3nA4DSTNVMBHK6lsTEHpjzPrl

