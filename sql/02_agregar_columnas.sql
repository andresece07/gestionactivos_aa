DO $$ BEGIN ALTER TABLE baterias ADD COLUMN dias_operacion integer DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE baterias ADD COLUMN estado_vida_util estado_vida_util DEFAULT 'ACTIVA'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE baterias ADD COLUMN fecha_fin_vida_util date; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
